
import './Loading.css';

function Loading(props) {
    return (
        <div className={`holder ${props.show ? '' :'hide'}`} >
            <div className="subholder">
                <span className="font-weight-bold pt-0">Loading...</span>
                <div className="pb-5 lds-ring d-inline-block position-relative">
                    <div className="d-block position-absolute rounded-circle mx-2 my-2"></div>
                    <div className="d-block position-absolute rounded-circle mx-2 my-2"></div>
                    <div className="d-block position-absolute rounded-circle mx-2 my-2"></div>
                    <div className="d-block position-absolute rounded-circle mx-2 my-2"></div>
                </div>
            </div>
        </div >

    );
}

export default Loading;
