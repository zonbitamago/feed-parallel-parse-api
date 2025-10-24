import os
import sys
from pathlib import Path
from bs4 import BeautifulSoup

# 主要ブラウザでのHTML構造確認（簡易）
# 本格的なE2EはCI/CDや外部サービスで実施推奨

def test_api_docs_html_exists():
    html_path = Path("contracts/api-docs/index.html")
    assert html_path.exists(), f"{html_path} が存在しません"

def test_api_docs_html_title():
    html_path = Path("contracts/api-docs/index.html")
    with open(html_path, encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
        title = soup.title.string if soup.title else ""
        assert "API" in title or "OpenAPI" in title or "Redoc" in title, "タイトルにAPI/Redoc等が含まれていません"

def test_api_docs_html_main_content():
    html_path = Path("contracts/api-docs/index.html")
    with open(html_path, encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
        # Redoc生成物の主要要素が存在するか
        assert soup.find(id="redoc-container") or soup.find("redoc"), "Redoc主要要素が見つかりません"
