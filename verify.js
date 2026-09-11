async function verify(boolean) {
  return new Promise((resolve, rejet) => {
    if (boolean === true) {
      resolve("todo ok");
    } else {
      rejet("esta todo mal");
    }
  });
}

module.exports=verify