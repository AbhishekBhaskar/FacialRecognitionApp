let express = require('express')
const path = require('path')

let app = express();

const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, '/dist/facial-recognition/browser')));

app.get('/*', (req, res) => {
    res.sendFile(__dirname+'/dist/facial-recognition/browser/index.html');
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});