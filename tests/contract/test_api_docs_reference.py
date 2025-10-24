import os
from pathlib import Path

def test_api_docs_reference_in_readme():
    """
    README.mdにAPI定義書参照手順が明記されているかを検証
    """
    readme_path = Path("README.md")
    assert readme_path.exists(), "README.mdが存在しません"
    content = readme_path.read_text(encoding="utf-8")
    assert "contracts/api-docs/index.html" in content, "README.mdにAPI定義書参照パスが明記されていません"
    assert "ブラウザ" in content or "参照" in content, "README.mdに参照手順の説明がありません"

def test_api_docs_reference_in_contracts_readme():
    """
    contracts/api-docs/README.mdに参照手順が明記されているかを検証
    """
    contracts_readme = Path("contracts/api-docs/README.md")
    assert contracts_readme.exists(), "contracts/api-docs/README.mdが存在しません"
    content = contracts_readme.read_text(encoding="utf-8")
    assert "index.html" in content, "contracts/api-docs/README.mdにindex.html参照手順がありません"
    assert "ブラウザ" in content or "参照" in content, "contracts/api-docs/README.mdに参照手順の説明がありません"
