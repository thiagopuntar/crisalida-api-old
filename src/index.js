const app = require('./app');

const PORT = process.env.API_PORT || 3000;
if(!module.parent){
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}