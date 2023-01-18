import { useEffect, useState } from 'react';
import { Select } from 'react-materialize';
import { useStore } from 'src/context/context';
import { getAllowedTokens, getERC20Token } from 'src/Utils';
import Snackbar from './Snackbar';

function AllowedTokens() {
  const { state, dispatch } = useStore();

  const { token, reloadToken, provider } = state;

  const [allowedTokens, setAllowedTokens] = useState<Array<string>>([]);

  const [showToast, setShowToast] = useState(false);

  const setToken = async (newToken: string) => {
    const erc20Token = await getERC20Token(provider!, newToken);
    dispatch({
      type: 'set_token',
      token: erc20Token,
    });
  };

  const verifyToken = (tokens: Array<string>): boolean => {
    if (!token) {
      return true;
    }
    if (!tokens.includes(token.instance.address)) {
      return true;
    }
    return false;
  };

  const validateChanges = (
    current: Array<string>,
    newValues: Array<string>
  ) => {
    if (current.sort().join('') === newValues.sort().join('')) {
      return true;
    }
    return false;
  };

  const queryTokens = async () => {
    dispatch({ type: 'reload_token', reloadToken: false });
    const tokens = await getAllowedTokens(provider!);
    setAllowedTokens(tokens);
    if (tokens.length === 0) {
      setShowToast(true);
      dispatch({
        type: 'set_token',
        token: undefined,
      });
      return;
    }
    if (validateChanges(allowedTokens, tokens)) {
      return;
    }
    if (verifyToken(tokens)) {
      setShowToast(false);
      setToken(tokens[0]!);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      queryTokens();
    }, 35000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (reloadToken) {
      queryTokens();
    }
  }, [reloadToken]);

  const handleChange = (event: any) => {
    setToken(event.target.value);
  };

  return (
    <div>
      <Select onChange={handleChange} disabled={allowedTokens.length < 2}>
        {allowedTokens.map((value) => (
          <option value={value} key={value}>
            {value}
          </option>
        ))}
      </Select>
      {showToast && <Snackbar message='Not Allowed Tokens' position={1} />}
    </div>
  );
}

export default AllowedTokens;
