from __future__ import annotations

import hashlib
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import BadZipFile, ZipFile

PERMISSION_RULES = {
    "android.permission.ACCESS_FINE_LOCATION": ("LOCATION", "HIGH", 18, "Precise device location can expose sensitive physical whereabouts."),
    "android.permission.ACCESS_COARSE_LOCATION": ("LOCATION", "MEDIUM", 10, "Approximate device location can expose general whereabouts."),
    "android.permission.ACCESS_BACKGROUND_LOCATION": ("LOCATION", "HIGH", 20, "Background location permits continuous location tracking even when app is closed."),
    "android.permission.CAMERA": ("CAMERA", "HIGH", 16, "Camera access can capture photos, videos, and environment visual data."),
    "android.permission.RECORD_AUDIO": ("MICROPHONE", "HIGH", 18, "Microphone access can record ambient audio, private conversations, and calls."),
    "android.permission.READ_CONTACTS": ("CONTACTS", "HIGH", 15, "Contacts access exposes the user's complete phone address book."),
    "android.permission.WRITE_CONTACTS": ("CONTACTS", "HIGH", 15, "Allows modifying the user's contacts and address book."),
    "android.permission.READ_SMS": ("SMS", "CRITICAL", 22, "SMS access can expose private text messages and incoming 2FA authentication codes."),
    "android.permission.RECEIVE_SMS": ("SMS", "CRITICAL", 20, "SMS interception can capture incoming 2FA verification codes before the user sees them."),
    "android.permission.SEND_SMS": ("SMS", "CRITICAL", 22, "Allows sending outgoing SMS messages, enabling toll fraud and covert C2 beaconing."),
    "android.permission.READ_PHONE_STATE": ("PHONE", "MEDIUM", 10, "Phone-state access exposes device IMEI, IMSI, phone number, and telephony state."),
    "android.permission.CALL_PHONE": ("PHONE", "HIGH", 15, "Allows initiating outgoing phone calls without dialing confirmation."),
    "android.permission.READ_CALL_LOG": ("CALL_LOG", "HIGH", 18, "Allows reading call history, incoming/outgoing contact records, and call durations."),
    "android.permission.WRITE_CALL_LOG": ("CALL_LOG", "HIGH", 15, "Allows modifying or deleting call history records to conceal fraud."),
    "android.permission.READ_EXTERNAL_STORAGE": ("STORAGE", "MEDIUM", 10, "Storage access can expose stored photos, documents, and media files."),
    "android.permission.WRITE_EXTERNAL_STORAGE": ("STORAGE", "MEDIUM", 10, "Storage access can modify shared device files."),
    "android.permission.INTERNET": ("NETWORK", "LOW", 3, "Network access allows the application to communicate with remote command-and-control servers."),
    "android.permission.BLUETOOTH_CONNECT": ("SENSORS_CONNECTIVITY", "MEDIUM", 8, "Bluetooth access can interact with nearby peripheral devices."),
    "android.permission.BODY_SENSORS": ("SENSORS", "HIGH", 15, "Sensor access can expose health, heart rate, or biometric measurements."),
    # High-hazard Trojan / Stalkerware flags
    "android.permission.SYSTEM_ALERT_WINDOW": ("DISPLAY_OVERLAY", "HIGH", 24, "Enables drawing floating overlay windows over legitimate banking/UPI apps to phish credentials."),
    "android.permission.BIND_ACCESSIBILITY_SERVICE": ("ACCESSIBILITY", "CRITICAL", 35, "Full accessibility control allows keystroke logging, reading screen content, and auto-clicking consent buttons."),
    "android.permission.REQUEST_INSTALL_PACKAGES": ("DROPPER", "HIGH", 20, "Allows requesting installation of other APKs, typical of multi-stage malware droppers."),
    "android.permission.RECEIVE_BOOT_COMPLETED": ("BOOT_PERSISTENCE", "MEDIUM", 8, "Allows automatic stealth execution immediately upon device reboot."),
    "android.permission.FOREGROUND_SERVICE": ("PERSISTENCE", "MEDIUM", 6, "Allows persistent background execution and notification hiding."),
    "android.permission.QUERY_ALL_PACKAGES": ("RECONNAISSANCE", "HIGH", 16, "Inventories all installed apps on the device to identify targeted banking and crypto wallets."),
}

CATEGORY_RECOMMENDATIONS = {
    "ACCESSIBILITY": "CRITICAL RISK: Accessibility permissions grant total device control. If this is not an official accessibility utility, uninstall the application immediately.",
    "DISPLAY_OVERLAY": "Do not grant 'Display over other apps' to unverified utility, delivery, or banking support apps. This is heavily exploited for fake login overlay attacks.",
    "DROPPER": "Disable 'Install unknown apps' permission in Android Settings > Apps > Special app access.",
    "SMS": "SMS permissions can intercept 2FA bank codes and OTPs. Revoke SMS permissions unless this is your default SMS messenger.",
    "LOCATION": "Restrict location permission to 'Only while using the app' or revoke it completely.",
    "MICROPHONE": "Grant microphone access only when active voice recording is explicitly needed.",
    "CAMERA": "Grant camera access only when photo or video features are actively in use.",
    "CONTACTS": "Avoid granting contacts access unless the application genuinely requires an address book feature.",
    "PHONE": "Review telephony permissions and restrict them unless required for voice calling.",
    "CALL_LOG": "Revoke call log permissions to protect private communication records.",
    "STORAGE": "Prefer scoped storage and verify that the application has a legitimate need for device files.",
    "RECONNAISSANCE": "Apps requesting complete inventory of installed software may be profiling banking and security apps.",
    "NETWORK": "Review remote communication and the application's declared network needs.",
    "BOOT_PERSISTENCE": "Applications executing on boot remain permanently resident in memory.",
}

HAZARD_COMBINATIONS = [
    {
        "name": "Banking Trojan & Screen Overlay Hijack",
        "signature_id": "SIG_BANKING_TROJAN_OVERLAY",
        "description": "The APK pairs screen overlay or accessibility hijacking with SMS access. This is the primary signature of Android banking trojans (e.g., TeaBot, Anatsa) designed to overlay fake login dialogs and intercept 2FA OTP codes.",
        "severity": "CRITICAL",
        "points": 35,
        "requires_all_groups": [
            {"android.permission.SYSTEM_ALERT_WINDOW", "android.permission.BIND_ACCESSIBILITY_SERVICE"},
            {"android.permission.RECEIVE_SMS", "android.permission.READ_SMS"},
        ],
    },
    {
        "name": "Full Stalkerware / Commercial Spyware Triad",
        "signature_id": "SIG_SPYWARE_TRIAD",
        "description": "Simultaneous request for background location tracking, audio recording, and contact/call log access. This pattern is characteristic of surveillance tools and stalkerware.",
        "severity": "CRITICAL",
        "points": 30,
        "requires_all_groups": [
            {"android.permission.RECORD_AUDIO"},
            {"android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_BACKGROUND_LOCATION"},
            {"android.permission.READ_CONTACTS", "android.permission.READ_CALL_LOG", "android.permission.READ_SMS"},
        ],
    },
    {
        "name": "Malware Dropper / Sideloading Hub",
        "signature_id": "SIG_DROPPER_HUB",
        "description": "The APK requests permission to install secondary APK packages and possesses network access. Attackers use this to download payload modules after initial installation.",
        "severity": "HIGH",
        "points": 22,
        "requires_all_groups": [
            {"android.permission.REQUEST_INSTALL_PACKAGES"},
            {"android.permission.INTERNET"},
        ],
    },
    {
        "name": "Silent Toll Fraud / Outgoing SMS Beacon",
        "signature_id": "SIG_SMS_TOLL_FRAUD",
        "description": "The APK can send outgoing SMS messages and register for device boot. Fraudulent apps use this to subscribe victims to paid premium services without notification.",
        "severity": "HIGH",
        "points": 20,
        "requires_all_groups": [
            {"android.permission.SEND_SMS"},
            {"android.permission.RECEIVE_BOOT_COMPLETED"},
        ],
    },
]


def _risk_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def _extract_manifest(apk_path: str) -> dict:
    try:
        with ZipFile(apk_path) as archive:
            if "AndroidManifest.xml" not in archive.namelist():
                raise ValueError("APK does not contain AndroidManifest.xml.")
    except (BadZipFile, OSError) as exc:
        raise ValueError("The uploaded file is not a valid APK archive.") from exc

    try:
        from androguard.core.apk import APK
    except ImportError as exc:
        raise RuntimeError(
            "Mobile APK analysis requires the androguard dependency."
        ) from exc

    apk = APK(apk_path)
    package_name = apk.get_package()
    permissions = sorted(set(apk.get_permissions() or []))

    # Safe extraction of additional metadata
    app_name = None
    try:
        app_name = apk.get_app_name()
    except Exception:
        pass

    min_sdk = None
    try:
        min_sdk = str(apk.get_min_sdk_version())
    except Exception:
        pass

    target_sdk = None
    try:
        target_sdk = str(apk.get_target_sdk_version())
    except Exception:
        pass

    activities = []
    services = []
    receivers = []
    try:
        activities = apk.get_activities() or []
        services = apk.get_services() or []
        receivers = apk.get_receivers() or []
    except Exception:
        pass

    return {
        "package_name": package_name,
        "app_name": app_name,
        "min_sdk": min_sdk,
        "target_sdk": target_sdk,
        "permissions": permissions,
        "activity_count": len(activities),
        "service_count": len(services),
        "receiver_count": len(receivers),
    }


def analyze_apk(apk_path: str) -> dict:
    path = Path(apk_path)
    if path.suffix.lower() != ".apk":
        raise ValueError("Only Android APK files are supported.")
    if not path.is_file():
        raise ValueError("APK file could not be read.")

    # Calculate cryptographic SHA-256 hash of the APK binary
    sha256_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    file_size_bytes = path.stat().st_size

    manifest_data = _extract_manifest(str(path))
    package_name = manifest_data["package_name"]
    permissions = manifest_data["permissions"]

    permission_set = set(permissions)
    findings = []
    score = 0
    categories = set()

    for permission in permissions:
        rule = PERMISSION_RULES.get(permission)
        if not rule:
            continue
        category, severity, points, rationale = rule
        categories.add(category)
        score += points
        findings.append({
            "permission": permission,
            "category": category,
            "severity": severity,
            "title": f"{category.replace('_', ' ').title()} permission declared",
            "description": rationale,
            "score": points,
            "rationale": rationale,
        })

    # Evaluate Threat Hazard Signatures (Combinatorial Attacks)
    detected_hazards = []
    for combo in HAZARD_COMBINATIONS:
        # Check if every group has at least one permission present in permission_set
        matches_all = True
        matched_perms = []
        for group in combo["requires_all_groups"]:
            intersect = group.intersection(permission_set)
            if not intersect:
                matches_all = False
                break
            matched_perms.extend(sorted(intersect))

        if matches_all:
            score += combo["points"]
            detected_hazards.append({
                "signature_id": combo["signature_id"],
                "name": combo["name"],
                "description": combo["description"],
                "severity": combo["severity"],
                "matched_permissions": matched_perms,
            })

    score = min(100, score)

    # If any detected hazard is CRITICAL, ensure score reflects high danger
    if any(h["severity"] == "CRITICAL" for h in detected_hazards):
        score = max(score, 85)

    risk_level = _risk_level(score)

    recommendations = []
    if detected_hazards:
        recommendations.append(
            "CRITICAL: High-risk malware signatures were matched. Do not grant requested permissions or install this APK on devices with banking apps."
        )

    for category in sorted(categories):
        recommendation = CATEGORY_RECOMMENDATIONS.get(category)
        if recommendation:
            recommendations.append(recommendation)

    if not findings and not detected_hazards:
        recommendations.append(
            "No permissions from the high-sensitivity rule set were detected; review the complete manifest and runtime behavior before treating the APK as safe."
        )

    confidence = 90 if permissions else 65
    evidence = {
        "sha256": sha256_hash,
        "file_size_bytes": file_size_bytes,
        "app_name": manifest_data.get("app_name"),
        "min_sdk": manifest_data.get("min_sdk"),
        "target_sdk": manifest_data.get("target_sdk"),
        "activity_count": manifest_data.get("activity_count", 0),
        "service_count": manifest_data.get("service_count", 0),
        "receiver_count": manifest_data.get("receiver_count", 0),
        "permission_count": len(permissions),
        "analyzed_sensitive_permission_count": len(findings),
        "hazard_signatures": detected_hazards,
        "hazard_count": len(detected_hazards),
        "categories": sorted(categories),
        "analysis_scope": "AndroidManifest.xml static analysis & hazard signatures",
    }

    return {
        "package_name": package_name,
        "permissions": permissions,
        "findings": findings,
        "recommendations": recommendations,
        "evidence": evidence,
        "risk_score": score,
        "risk_level": risk_level,
        "confidence": confidence,
    }
