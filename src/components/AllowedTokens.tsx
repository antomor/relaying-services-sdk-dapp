import { useEffect, useState } from 'react';
import { Select } from 'react-materialize';
import { useStore } from 'src/context/context';
import Utils from 'src/Utils';

function AllowedTokens() {
    const { state, dispatch } = useStore();

    const { token, provider } = state;

    const [allowedTokens, setAllowedTokens] = useState<Array<string>>([]);

    const setToken = async (newToken: string) => {
        const symbol: string = await Utils.tokenSymbol(newToken);
        const decimals: number = await Utils.tokenDecimals(newToken);
        dispatch({
            type: 'set_token',
            token: { address: newToken, symbol, decimals }
        });
    };

    const reload = async () => {
        const tokens = await provider!.getAllowedTokens();
        if (tokens.length > 0) {
            setAllowedTokens(tokens);
            if (!token) {
                setToken(tokens[0]);
            }
        } else {
            alert('Not allowed tokens');
        }
    };

    useEffect(() => {
        reload();
    }, [token]);

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
