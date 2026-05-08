
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



if(rejectBtn){
  const modal = document.getElementById('rejectionModal');
  const confirmBtn = document.getElementById('confirmRejectBtn');
  const reasonInput = document.getElementById('rejectionReasonInput');

  window.closeRejectionModal = () => {
    modal.classList.remove('open');
    reasonInput.value = '';
  };

  rejectBtn.addEventListener("click", () => {
    modal.classList.add('open');
  });

  confirmBtn.addEventListener("click", async () => {
    try {
      const reason = reasonInput.value.trim();

      if (!reason) {
        Swal.fire({
          icon: 'warning',
          title: 'Reason Required',
          text: 'Please provide a reason for the rejection.',
          confirmButtonColor: '#1C1C1C'
        });
        return;
      }

      await axios.patch(
        `/admin/returns/${rejectBtn.dataset.id}/reject`,
        { reason }
      );

      window.location.reload();
    } catch (err) {
      console.log(err);
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: 'Could not process the rejection. Please try again.',
        confirmButtonColor: '#1C1C1C'
      });
    }
  });
}

if(schedulePickupBtn){
schedulePickupBtn
.addEventListener(
"click",
async ()=>{

try{

   const pickupDate =document.getElementById(
      "pickupDate"
   ).value;

   const pickupTime =document.getElementById(
      "pickupTime"
   ).value;

    if (!pickupDate || !pickupTime) {
     ajaxToast("error","Date and time mandatory")
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


if(pickedUpBtn){

pickedUpBtn.addEventListener("click",async ()=>{

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
