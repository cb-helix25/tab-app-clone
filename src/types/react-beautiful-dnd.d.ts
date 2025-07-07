import 'react-beautiful-dnd';

declare module 'react-beautiful-dnd' {
    interface DragDropContextProps {
        autoScrollDisabled?: boolean;
    }
}

// invisible change
