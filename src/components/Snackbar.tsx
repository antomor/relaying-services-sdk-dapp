type SnackbarProps = {
    message: string;
    position: number;
};

function Snackbar({ message, position }: SnackbarProps) {
    return (
        <span
            className='toast'
            style={{
                justifyContent: 'center',
                position: 'absolute',
                bottom: `${position * 10}%`,
                right: 0,
                left: 0,
                margin: '0 auto',
                width: '250px',
                top: 'unset'
            }}
        >
            {message}
        </span>
    );
}

export default Snackbar;
