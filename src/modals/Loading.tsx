import { useStore } from 'src/context/context';
import 'src/modals/Loading.css';

function Loading() {
    const { state } = useStore();

    return (
        <div className={`holder ${state.loader ? '' : 'hide'}`}>
            <div className='subholder'>
                <span className='font-weight-bold pt-0'>Loading...</span>
                <div className='pb-5 lds-ring d-inline-block position-relative'>
                    <div className='d-block position-absolute rounded-circle mx-2 my-2' />
                    <div className='d-block position-absolute rounded-circle mx-2 my-2' />
                    <div className='d-block position-absolute rounded-circle mx-2 my-2' />
                    <div className='d-block position-absolute rounded-circle mx-2 my-2' />
                </div>
            </div>
        </div>
    );
}

export default Loading;
