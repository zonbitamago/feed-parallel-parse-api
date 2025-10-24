# Data Model: Go バージョン管理

## Entities

### go.mod

- version: string (例: "1.25")
- dependencies: list of { name: string, version: string }

### 依存パッケージ一覧（2025-10-24 時点）

- name: github.com/stretchr/testify
  version: v1.11.1
  supported_go_versions: ["1.24", "1.25"]
- name: github.com/davecgh/go-spew
  version: v1.1.1
  supported_go_versions: ["1.24", "1.25"]
- name: github.com/pmezard/go-difflib
  version: v1.0.0
  supported_go_versions: ["1.24", "1.25"]
- name: gopkg.in/yaml.v3
  version: v3.0.1
  supported_go_versions: ["1.24", "1.25"]

## Validation Rules

- go.mod の version は "1.25" または "1.24" のいずれかであること
- すべての dependencies が go.mod の version に対応していること

## State Transitions

- version 変更時、全 dependencies の対応状況をチェック
- 未対応があれば version を "1.24" にロールバック
