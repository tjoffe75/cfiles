import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, onConfirm, children, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-body">
                    {children}
                </div>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="btn-confirm">{confirmText}</button>
                    <button onClick={onClose} className="btn-cancel">{cancelText}</button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
