import { FC, useState } from 'react';

interface GenericIconProps {
    icon: string;
    onClick?: () => void;
    onHoverStyle?: React.CSSProperties;
    className?: string;
    width?: number | string;
    height?: number | string;
    title?: string;
}

const GenericIcon: FC<GenericIconProps> = ({
    icon,
    onClick,
    onHoverStyle,
    className = '',
    width = 24,
    height = 24,
    title
}) => {
    const [isHovered, setIsHovered] = useState(false);

    if (icon === 'github') {
        return (
            <svg
                width={width}
                height={height}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                    ...(isHovered && onHoverStyle)
                }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {title && <title>{title}</title>}
                <path d='M3.5 15.668q.675.081 1 .618c.326.537 1.537 2.526 2.913 2.526H9.5m5.672-3.513q.823 1.078.823 1.936V21m-5.625-5.609q-.87.954-.869 1.813V21' />
                <path d='M15.172 15.299c1.202-.25 2.293-.682 3.14-1.316 1.448-1.084 2.188-2.758 2.188-4.411 0-1.16-.44-2.243-1.204-3.16-.425-.511.819-3.872-.286-3.359-1.105.514-2.725 1.198-3.574.947-.909-.268-1.9-.416-2.936-.416-.9 0-1.766.111-2.574.317-1.174.298-2.296-.363-3.426-.848-1.13-.484-.513 3.008-.849 3.422C4.921 7.38 4.5 8.44 4.5 9.572c0 1.653.895 3.327 2.343 4.41.965.722 2.174 1.183 3.527 1.41' />
            </svg>
        );
    }

    if (icon === 'like') {
        return (
            <svg
                width={width}
                height={height}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                    ...(isHovered && onHoverStyle)
                }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {title && <title>{title}</title>}
                <path d='M14.54 10.105h5.533c2.546 0-.764 10.895-2.588 10.895H4.964A.956.956 0 0 1 4 20.053v-9.385c0-.347.193-.666.502-.832C6.564 8.73 8.983 7.824 10.18 5.707l1.28-2.266A.87.87 0 0 1 12.222 3c3.18 0 2.237 4.63 1.805 6.47a.52.52 0 0 0 .513.635' />
            </svg>
        );
    }

    if (icon === 'dislike') {
        return (
            <svg
                width={width}
                height={height}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                    ...(isHovered && onHoverStyle)
                }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {title && <title>{title}</title>}
                <path d='M10.46 13.895H4.927C2.381 13.895 5.691 3 7.515 3h12.521c.532 0 .964.424.964.947v9.385a.95.95 0 0 1-.502.832c-2.062 1.106-4.481 2.012-5.678 4.129l-1.28 2.266a.87.87 0 0 1-.762.441c-3.18 0-2.237-4.63-1.805-6.47a.52.52 0 0 0-.513-.635' />
            </svg>
        );
    }

    if (icon === 'info') {
        return (
            <svg
                width={width}
                height={height}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                    ...(isHovered && onHoverStyle)
                }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {title && <title>{title}</title>}
                <path d='M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' />
                <path d='M12 16v-5h-.5m0 5h1M12 8.5V8' />
            </svg>
        );
    }

    if (icon === 'email') {
        return (
            <svg
                width={width}
                height={height}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                    ...(isHovered && onHoverStyle)
                }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {title && <title>{title}</title>}
                <path d='m2.357 7.714 6.98 4.654c.963.641 1.444.962 1.964 1.087.46.11.939.11 1.398 0 .52-.125 1.001-.446 1.964-1.087l6.98-4.654M7.157 19.5h9.686c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.31-1.311c.328-.642.328-1.482.328-3.162V9.3c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311c-.642-.327-1.482-.327-3.162-.327H7.157c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.31 1.311c-.328.642-.328 1.482-.328 3.162v5.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311c.642.327 1.482.327 3.162.327' />
            </svg>
        );
    }

    if (icon === 'play') {
        return (
            <svg
                width={width}
                height={height}
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                    ...(isHovered && onHoverStyle)
                }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {title && <title>{title}</title>}
                <path d='M14.581 9.402C16.194 10.718 17 11.375 17 12.5s-.806 1.783-2.419 3.098a23 23 0 0 1-1.292.99c-.356.25-.759.508-1.176.762-1.609.978-2.413 1.467-3.134.926-.722-.542-.787-1.675-.918-3.943A33 33 0 0 1 8 12.5c0-.563.023-1.192.06-1.833.132-2.267.197-3.401.919-3.943.721-.541 1.525-.052 3.134.926.417.254.82.512 1.176.762a23 23 0 0 1 1.292.99' />
            </svg>
        );
    }

    return null;
};

export default GenericIcon;
