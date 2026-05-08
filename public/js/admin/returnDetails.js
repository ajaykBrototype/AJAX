
const approveBtn =
document.getElementById(
   "approveBtn"
);

const rejectBtn =
document.getElementById(
   "rejectBtn"
);

const schedulePickupBtn =
document.getElementById(
   "schedulePickupBtn"
);

const pickedUpBtn =
document.getElementById(
   "pickedUpBtn"
);



/* =========================
   APPROVE
========================= */

if(approveBtn){

approveBtn.addEventListener(
"click",
async ()=>{

try{

   await axios.patch(
      `/admin/returns/${
         approveBtn.dataset.id
      }/approve`
   );

   window.location.reload();

}catch(err){

   console.log(err);

}

});
}



/* =========================
   REJECT
========================= */

if(rejectBtn){

rejectBtn.addEventListener(
"click",
async ()=>{

try{

   const reason =
   prompt(
      "Enter rejection reason"
   );

   if(!reason) return;

   await axios.patch(
      `/admin/returns/${
         rejectBtn.dataset.id
      }/reject`,
      { reason }
   );

   window.location.reload();

}catch(err){

   console.log(err);

}

});
}



/* =========================
   SCHEDULE PICKUP
========================= */

if(schedulePickupBtn){

schedulePickupBtn
.addEventListener(
"click",
async ()=>{

try{

   const pickupDate =
   document.getElementById(
      "pickupDate"
   ).value;

   const pickupTime =
   document.getElementById(
      "pickupTime"
   ).value;

    if (!pickupDate || !pickupTime) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Date and time are mandatory',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    await axios.patch(
      `/admin/returns/${
         schedulePickupBtn.dataset.id
      }/schedule-pickup`,
      {
         pickupDate,
         pickupTime
      }
    );

   window.location.reload();

}catch(err){

   console.log(err);

}

});
}



/* =========================
   MARK PICKED UP
========================= */

if(pickedUpBtn){

pickedUpBtn.addEventListener(
"click",
async ()=>{

try{

   await axios.patch(
      `/admin/returns/${
         pickedUpBtn.dataset.id
      }/picked-up`
   );

   window.location.reload();

}catch(err){

   console.log(err);

}

});
}
