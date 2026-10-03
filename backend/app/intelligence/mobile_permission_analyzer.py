from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import BadZipFile, ZipFile

PERMISSION_RULES = {
    "android.permission.ACCESS_FINE_LOCATION": ("LOCATION", "HIGH", 18, "Precise device location can expose sensitive movement and whereabouts."),
    "android.permission.ACCESS_COARSE_LOCATION": ("LOCATION", "MEDIUM", 10, "Approximate device location can expose whereabouts."),
    "android.permission.ACCESS_BACKGROUND_LOCATION": ("LOCATION", "HIGH", 20, "Background location permits continuous location access."),
    "android.permission.CAMERA": ("CAMERA", "HIGH", 16, "Camera access can expose images and video."),
    "android.permission.RECORD_AUDIO": ("MICROPHONE", "HIGH", 18, "Microphone access can expose ambient audio."),
    "android.permission.READ_CONTACTS": ("CONTACTS", "HIGH", 15, "Contacts access can expose the user's address book."),
    "android.permission.READ_SMS": ("SMS", "CRITICAL", 22, "SMS access can expose private messages and authentication codes."),
    "android.permission.RECEIVE_SMS": ("SMS", "HIGH", 16, "SMS interception can expose incoming messages and codes."),
    "android.permission.READ_PHONE_STATE": ("PHONE", "MEDIUM", 10, "Phone-state access exposes device or telephony information."),
    "android.permission.CALL_PHONE": ("PHONE", "HIGH", 15, "Phone-call permission can initiate calls."),
    "android.permission.READ_EXTERNAL_STORAGE": ("STORAGE", "MEDIUM", 10, "Storage access can expose user files on supported Android versions."),
    "android.permission.WRITE_EXTERNAL_STORAGE": ("STORAGE", "MEDIUM", 10, "Storage access can modify shared files on supported Android versions."),
    "android.permission.INTERNET": ("NETWORK", "LOW", 3, "Network access allows the application to communicate with remote services."),
    "android.permission.BLUETOOTH_CONNECT": ("SENSORS_CONNECTIVITY", "MEDIUM", 8, "Bluetooth access can interact with nearby devices."),
    "android.permission.BODY_SENSORS": ("SENSORS", "HIGH", 15, "Sensor access can expose health or activity-related measurements."),
}

CATEGORY_RECOMMENDATIONS = {
    "LOCATION": "Review whether location access is necessary and whether it can be limited to foreground use.",
    "MICROPHONE": "Grant microphone access only when the application feature explicitly requires it.",
    "CAMERA": "Grant camera access only when image or video features require it.",
    "CONTACTS": "Avoid granting contacts access unless the application has a clear contact-related purpose.",
    "SMS": "Treat SMS permissions as highly sensitive because they can expose messages and authentication codes.",
    "PHONE": "Review telephony permissions and restrict them unless required by the application.",
    "STORAGE": "Prefer scoped storage and minimize access to shared files.",
    "NETWORK": "Review remote communication and the application's declared network needs.",
    "SENSORS": "Verify that sensor access matches an explicit application feature.",
    "SENSORS_CONNECTIVITY": "Review Bluetooth access and restrict nearby-device permissions where possible.",
}


def _risk_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def _extract_manifest(apk_path: str) -> tuple[str | None, list[str]]:
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
    return package_name, permissions


def analyze_apk(apk_path: str) -> dict:
    path = Path(apk_path)
    if path.suffix.lower() != ".apk":
        raise ValueError("Only Android APK files are supported.")
    if not path.is_file():
        raise ValueError("APK file could not be read.")

    package_name, permissions = _extract_manifest(str(path))

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

    score = min(100, score)
    recommendations = []
    for category in sorted(categories):
        recommendation = CATEGORY_RECOMMENDATIONS.get(category)
        if recommendation:
            recommendations.append(recommendation)

    if not findings:
        recommendations.append(
            "No permissions from the high-sensitivity rule set were detected; review the complete manifest and runtime behavior before treating the APK as safe."
        )

    confidence = 85 if permissions else 65
    evidence = {
        "permission_count": len(permissions),
        "analyzed_sensitive_permission_count": len(findings),
        "categories": sorted(categories),
        "analysis_scope": "AndroidManifest.xml permissions",
    }

    return {
        "package_name": package_name,
        "permissions": permissions,
        "findings": findings,
        "recommendations": recommendations,
        "evidence": evidence,
        "risk_score": score,
        "risk_level": _risk_level(score),
        "confidence": confidence,
    }
