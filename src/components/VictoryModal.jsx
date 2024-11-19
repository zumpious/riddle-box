import React from 'react';
import Modal from 'react-modal';
import './VictoryModal.css';

Modal.setAppElement('#root');

const VictoryModal = ({ 
  isOpen, 
  onClose, 
  title = "🎉 Congratulations! 🎉",
  message,
  stats = []  // Array of {label, value} objects
}) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    className="victory-modal"
    overlayClassName="victory-modal-overlay"
  >
    <div className="victory-content">
      <h2>{title}</h2>
      <p>{message}</p>
      {stats.map(({ label, value }, index) => (
        <p key={index}>
          {label}: {value}
        </p>
      ))}
      <button onClick={onClose}>Close</button>
    </div>
  </Modal>
);

export default VictoryModal;