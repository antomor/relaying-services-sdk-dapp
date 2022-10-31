import { useEffect, useState } from 'react';
import { Modal, Col, Row, Table, Button, Icon } from 'react-materialize';
import { Transaction } from 'src/types';
import Utils from 'src/Utils';
import { useStore } from 'src/context/context';

function TransactionHistory() {
    const { state, dispatch } = useStore();

    const { modals, chainId, smartWallet } = state;

    const columns: string[] = ['No', 'Date', 'Transaction', 'Type', 'Action'];

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (
            Utils.getTransactionKey(
                chainId,
                smartWallet?.address!
            ) in localStorage
        ) {
            try {
                const localTransactions: Transaction[] = JSON.parse(
                    localStorage.getItem(
                        Utils.getTransactionKey(
                            chainId,
                            smartWallet?.address!
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
    }, [smartWallet]);

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
            open={modals.transactions}
            options={{
                onCloseEnd: () =>
                    dispatch({
                        type: 'set_modals',
                        modal: { transactions: false }
                    })
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
