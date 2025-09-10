import Modal from '../common/Modal';
import { Compass } from 'lucide-react';

function AnalysisNotificationModal({ isOpen, onClose }) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="px-8 py-10">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon with animation */}
          <div className="relative">
            <Compass className="h-16 w-16 text-primary-600 dark:text-primary-400 animate-spin" />
            <div className="absolute inset-0 h-16 w-16 bg-primary-600 opacity-20 rounded-full animate-ping" />
          </div>
          
          {/* Coffee message */}
          <p className="text-lg text-gray-700 dark:text-gray-300">
            This might take a few minutes, feel free to grab a coffee.
          </p>
          <p className="text-base text-gray-600 dark:text-gray-400">
            We will load your feedback as we get it though, close this popup to check it out.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default AnalysisNotificationModal;