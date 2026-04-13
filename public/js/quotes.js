document.querySelector("#closeModal").addEventListener("click", ()=>{ document.querySelector("#authorModal").close();})
let authorLinks = document.querySelectorAll(".authorNames");
for (let i of authorLinks) {
    //alert(i);
    i.addEventListener("click", displayAuthorInfo );
}

async function displayAuthorInfo() {
    let authorId = this.getAttribute("authorid");
    //alert("authorId: " + authorId);
    //alert("displaying author info..." + authorId);
    let url ="/api/author/" + authorId;
    let response = await fetch(url);
    let data = await response.json();
    //console.log(data[0].firstName);
    document.querySelector("#authorName").textContent = data[0].firstName + " " + data[0].lastName;
    document.querySelector("#authorPicture").src = data[0].portrait;

    document.querySelector("#authorModal").showModal();
}