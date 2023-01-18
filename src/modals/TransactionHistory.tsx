import { useEffect, useState } from 'react';
import { Modal, Col, Row, Table, Button, Icon } from 'react-materialize';
import type { LocalTransaction } from 'src/types';
import { useStore } from 'src/context/context';
import { getTransactionKey, openExplorer } from 'src/Utils';

function TransactionHistory() {
  const { state, dispatch } = useStore();

  const { modals, chainId, smartWallet } = state;

  const columns: string[] = ['No', 'Date', 'Transaction', 'Type', 'Action'];

  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);

  useEffect(() => {
    if (getTransactionKey(chainId, smartWallet?.address!) in localStorage) {
      try {
        const localTransactions: LocalTransaction[] = JSON.parse(
          localStorage.getItem(
            getTransactionKey(chainId, smartWallet?.address!)
          )!
        );
        setTransactions(localTransactions);
      } catch (e) {
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }
  }, [smartWallet, chainId]);

  const handleOpenExplorer = (transaction: LocalTransaction) => {
    openExplorer(transaction.id);
  };

  const tableRows = transactions.map(
    (transaction: LocalTransaction, index: number) => (
      <tr key={transaction.id}>
        <td>{index}</td>
        <td>{transaction.date.toString()}</td>
        <td style={{ wordBreak: 'break-all' }}>{transaction.id}</td>
        <td>{transaction.type}</td>
        <td>
          <Button
            waves='light'
            className='indigo accent-2'
            onClick={() => handleOpenExplorer(transaction)}
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
            modal: { transactions: false },
          }),
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
