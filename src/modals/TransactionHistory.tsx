import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Modal, Col, Row, Table, Button, Icon } from 'react-materialize';
import { Modals, Transaction } from 'src/types';
import Utils from 'src/Utils';
import { useStore } from 'src/context/context';

type TransactionHistoryProps = {
    modal: Modals;
    setModal: Dispatch<SetStateAction<Modals>>;
};

function TransactionHistory(props: TransactionHistoryProps) {
    const { state } = useStore();

    const { modal, setModal } = props;

    const columns: string[] = ['No', 'Date', 'Transaction', 'Type', 'Action'];

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (
            Utils.getChainKey(state.chainId, state.smartWallet?.address!) in
            localStorage
        ) {
            try {
                const localTransactions: Transaction[] = JSON.parse(
                    localStorage.getItem(
                        Utils.getChainKey(
                            state.chainId,
                            state.smartWallet?.address!
                        )
                    )!
                );
                setTransactions(localTransactions);
            } catch (e) {
                setTransactions([]);
            }
        } else {
            setTransactions([]);
        }
    }, [state.smartWallet]);

    const openExplorer = (transaction: Transaction) => {
        Utils.openExplorer(transaction.id);
    };

    const tableRows = transactions.map(
        (transaction: Transaction, index: number) => (
            <tr key={transaction.id}>
                <td>{index}</td>
                <td>{transaction.date}</td>
                <td style={{ wordBreak: 'break-all' }}>{transaction.id}</td>
                <td>{transaction.type}</td>
                <td>
                    <Button
                        waves='light'
                        className='indigo accent-2'
                        onClick={() => openExplorer(transaction)}
                        tooltip='Explore'
                        floating
                    >
                        <Icon center>language</Icon>
                    </Button>
                </td>
            </tr>
        )
    );

    return (
        <Modal
            open={modal.transactions}
            options={{
                onCloseEnd: () =>
                    setModal((prev) => ({ ...prev, transactions: false }))
            }}
        >
            <Row>
                <Col s={12}>
                    <Table responsive striped>
                        <thead>
                            <tr>
                                {columns.map((column: string) => (
                                    <th key={column}>{column}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? (
                                tableRows
                            ) : (
                                <tr>
                                    <td colSpan={5}>There are no records</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Modal>
    );
}

export default TransactionHistory;
