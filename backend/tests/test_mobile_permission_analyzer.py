from pathlib import Path
import pytest
from app.intelligence.mobile_permission_analyzer import analyze_apk

def test_invalid_apk_is_rejected(tmp_path: Path):
    path=tmp_path/"not-an-apk.apk"
    path.write_text("not an apk")
    with pytest.raises(ValueError):
        analyze_apk(str(path))

def test_non_apk_is_rejected(tmp_path: Path):
    path=tmp_path/"file.txt"
    path.write_text("data")
    with pytest.raises(ValueError):
        analyze_apk(str(path))
