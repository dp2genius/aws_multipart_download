import { render } from 'react-dom';
import { useState } from 'react';
import { downloadFiles } from './download';

function App() {
  let [size, setSize] = useState(0);
  let [comments, setComments] = useState([]);

  return (
    <div>
      <button onClick={downloadFiles(setComments, setSize)}>Start</button>
      <p>downloaded {size / 1024 / 1024} MB</p>
      {comments.map((comment, idx) => <p key={idx}>{comment}</p>)}
    </div>
  );
}

render(<App />, document.getElementById('root'));