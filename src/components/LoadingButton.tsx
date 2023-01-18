type LoadingButtonProps = {
  show: boolean;
};

function LoadingButton({ show }: LoadingButtonProps) {
  return (
    <img
      alt='loading'
      className={`loading ${!show ? 'hide' : ''}`}
      src='images/loading2.gif'
    />
  );
}

export default LoadingButton;
