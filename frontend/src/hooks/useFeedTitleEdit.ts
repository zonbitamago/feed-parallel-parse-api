import { useState, useEffect, useRef, useCallback } from 'react'
import type { Subscription } from '../types/models'
import { getDisplayTitle, validateCustomTitle } from '../types/models'

/**
 * フィードタイトル編集のカスタムフック
 *
 * @param onUpdate - タイトル更新時のコールバック
 * @returns 編集状態と操作関数
 */
export function useFeedTitleEdit(onUpdate?: (id: string, customTitle: string) => void) {
  // 編集状態管理
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  /**
   * 編集モード開始
   */
  const startEdit = useCallback((subscription: Subscription) => {
    setEditingId(subscription.id)
    setEditValue(getDisplayTitle(subscription))
    setEditError(null)
  }, [])

  /**
   * 編集保存
   */
  const saveEdit = useCallback((id: string) => {
    const validation = validateCustomTitle(editValue)
    if (!validation.valid) {
      setEditError(validation.error || null)
      return
    }

    if (onUpdate) {
      onUpdate(id, validation.trimmed)
    }

    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }, [editValue, onUpdate])

  /**
   * 編集キャンセル
   */
  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }, [])

  /**
   * キーボード操作ハンドラー（Enter: 保存、Escape: キャンセル）
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }, [saveEdit, cancelEdit])

  /**
   * 編集値変更ハンドラー
   */
  const changeEditValue = useCallback((value: string) => {
    setEditValue(value)
  }, [])

  // 編集モード開始時にinputにフォーカス
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  return {
    // 状態
    editingId,
    editValue,
    editError,
    editInputRef,
    // 操作関数
    startEdit,
    saveEdit,
    cancelEdit,
    handleKeyDown,
    changeEditValue,
  }
}