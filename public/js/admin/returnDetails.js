
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
       Swal.fire({
          icon: 'warning',
          title: 'Missing Details',
          text: 'Date and time are mandatory.',
          confirmButtonColor: '#1C1C1C'
       });
       return;
    }

    const [d, m, y] = pickupDate.split('-');
    const parsedDate = `${y}-${m}-${d}`;

    await axios.patch(
      `/admin/returns/${
         schedulePickupBtn.dataset.id
      }/schedule-pickup`,
      {
         pickupDate: parsedDate,
         pickupTime
      }
    );

   window.location.reload();

}catch(err){

   console.log(err);
   Swal.fire({
      icon: 'error',
      title: 'Failed',
      text: 'Could not schedule pickup details. Please try again.',
      confirmButtonColor: '#1C1C1C'
   });

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
