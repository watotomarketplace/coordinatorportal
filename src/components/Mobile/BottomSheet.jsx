import React from 'react'
import { Sheet } from 'react-modal-sheet'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="content-height">
      <Sheet.Container style={{ 
        background: 'rgba(28,28,30,0.9)', 
        backdropFilter: 'blur(30px) saturate(200%)',
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Sheet.Header>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
            {/* iOS Grabber */}
            <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.3)' }} />
          </div>
          {title && (
            <div style={{ padding: '8px 24px 16px', fontSize: '22px', fontWeight: 700, color: 'white' }}>
              {title}
            </div>
          )}
        </Sheet.Header>
        <Sheet.Content style={{ padding: '0 24px 32px' }}>
          {children}
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  )
}
