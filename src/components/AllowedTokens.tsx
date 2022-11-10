import { useEffect, useState } from 'react';
import { Select } from 'react-materialize';
import { useStore } from 'src/context/context';

function AllowedTokens() {
    const { state, dispatch } = useStore();

    const { token, provider, reloadToken } = state;

    const [allowedTokens, setAllowedTokens] = useState<Array<string>>([]);

    const [showToast, setShowToast] = useState(false);

    const setToken = async (newToken: string) => {
        const erc20Token = await provider!.getERC20Token(newToken, {
            decimals: true,
            symbol: true
        });
        dispatch({
            type: 'set_token',
            token: erc20Token
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
        const tokens = await provider!.getAllowedTokens();
        setAllowedTokens(tokens);
        if (tokens.length === 0) {
            setShowToast(true);
            dispatch({
                type: 'set_token',
                token: undefined
            });
            return;
        }
        if (validateChanges(allowedTokens, tokens)) {
            return;
        }
        if (verifyToken(tokens)) {
            setShowToast(false);
            setToken(tokens[0]);
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
        dispatch({ type: 'reload_token', reloadToken: false });
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
            {showToast && (
                <span
                    className='toast'
                    style={{
                        position: 'absolute',
                        bottom: '10%',
                        right: '45%',
                        top: 'unset'
                    }}
                >
                    Not allowed tokens{' '}
                </span>
            )}
        </div>
    );
}

export default AllowedTokens;
