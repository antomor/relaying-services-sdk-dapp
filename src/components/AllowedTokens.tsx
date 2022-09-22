import { useEffect, useState } from 'react';
import { Select } from 'react-materialize';
import { useStore } from 'src/context/context';
import Utils from 'src/Utils';

type AllowedTokensProps = {
    updateInfo: boolean;
};

function AllowedTokens({ updateInfo }: AllowedTokensProps) {
    const { state, dispatch } = useStore();

    const [allowedTokens, setAllowedTokens] = useState<Array<string>>([]);

    const setToken = async (token: string) => {
        const symbol: string = await Utils.tokenSymbol(token);
        const decimals: number = await Utils.tokenDecimals(token);
        dispatch({
            type: 'set_token',
            token: { address: token, symbol, decimals }
        });
    };

    const reload = async () => {
        const tokens = await state.provider!.getAllowedTokens();
        if (tokens.length > 0) {
            setAllowedTokens(tokens);
            if (!state.token) {
                setToken(tokens[0]);
            }
        } else {
            alert('Not allowed tokens');
        }
    };

    useEffect(() => {
        if (!updateInfo) {
            return;
        }
        reload();
    }, [updateInfo]);

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
