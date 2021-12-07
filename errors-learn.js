// for synchronous code 

function sum(a, b){
    if(a && b){
        return a+b;
    }

    throw new Error("PLease provide 2 no.s");
}

try{
    // const a=sum(8,12);
    const a=sum(8);
    console.log(a);
}
catch(err){
    console.log("Error occured");
    // console.log(err);
}

console.log("Shivam Kumar")