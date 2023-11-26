import { render } from 'react-dom';
import { useState } from 'react';
import { downloadFiles } from './download';

function App() {
  let [size, setSize] = useState(0);
  let [comments, setComments] = useState([]);

  let onClick = () => {
    downloadFiles((msg) => {
      switch(msg.type) {
        case 'downloaded':
          setSize(size => size + msg.payload);
          break;
        case 'size':
          setComments(comments => [...comments, `Total file size ${msg.payload} bytes`]);
          break;
      }
    });
  };

  return (
    <div>
      <button onClick={onClick}>Start</button>
      <p>downloaded {size / 1024 / 1024} MB</p>
      {comments.map((comment, idx) => <p key={idx}>{comment}</p>)}
    </div>
  );
}

render(<App />, document.getElementById('root'));