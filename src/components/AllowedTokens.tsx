import { useCallback, useEffect, useState } from 'react';
import { Select } from 'react-materialize';
import { useStore } from 'src/context/context';

function AllowedTokens() {
    const { state, dispatch } = useStore();

    const { token, provider, reload } = state;

    const [allowedTokens, setAllowedTokens] = useState<Array<string>>([]);

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

    const reloadTokens = useCallback(async () => {
        const tokens = await provider!.getAllowedTokens();
        if (tokens.length > 0) {
            setAllowedTokens(tokens);
            if (!token) {
                setToken(tokens[0]);
            }
        } else {
            alert('Not allowed tokens');
        }
    }, [reload]);

    useEffect(() => {
        if (!reload) {
            reloadTokens();
        }
    }, [reload]);

    const handleChange = (event: any) => {
        setToken(event.target.value);
    };

    return (
        <Select onChange={handleChange} disabled={allowedTokens.length < 2}>
            {allowedTokens.map((value) => (
                <option value={value} key={value}>
                    {value}
                </option>
            ))}
        </Select>
    );
}

export default AllowedTokens;
