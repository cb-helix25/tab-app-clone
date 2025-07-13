import 'react-icons/lib';

declare module 'react-icons/lib' {
    export type IconType = (props: IconBaseProps) => JSX.Element;
}