import { useEffect, useState } from 'react';
import { Select } from 'react-materialize';
import { useStore } from '../context/context';
import Utils from '../Utils';

type AllowedTokensProps = {
    updateInfo: boolean;
};

function AllowedTokens(props: AllowedTokensProps) {
    const { updateInfo } = props;

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
            setToken(tokens[0]);
        } else {
            alert('Not allowed tokens');
        }
    };

    useEffect(() => {
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
