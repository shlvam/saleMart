const fs = require('fs');

exports.fileDelete = (fsPath) => {
    fs.unlink(fsPath, (err) => {
        if(err){
            throw(err);
        }
        console.log(fsPath + 'deleted');
    })
};