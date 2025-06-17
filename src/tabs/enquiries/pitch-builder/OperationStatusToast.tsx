import React from 'react';
import { MessageBar, MessageBarType, Spinner, SpinnerSize } from '@fluentui/react';
import { CSSTransition } from 'react-transition-group';
import '../../../app/styles/toast.css';

interface OperationStatusToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  loading?: boolean;
}

const OperationStatusToast: React.FC<OperationStatusToastProps> = ({ visible, message, type, loading }) => {
  const messageBarType =
    type === 'success' ? MessageBarType.success : type === 'error' ? MessageBarType.error : MessageBarType.info;

  return (
    <CSSTransition in={visible} timeout={200} classNames="toast" unmountOnExit>
      <MessageBar
        messageBarType={messageBarType}
        isMultiline={false}
        styles={{
          root: {
            position: 'fixed',
            bottom: 20,
            right: 20,
            maxWidth: 350,
            zIndex: 2000,
            borderRadius: 8,
          },
        }}
      >
        {loading && <Spinner size={SpinnerSize.xSmall} styles={{ root: { marginRight: 8 } }} />}
        {message}
      </MessageBar>
    </CSSTransition>
  );
};

export default OperationStatusToast;