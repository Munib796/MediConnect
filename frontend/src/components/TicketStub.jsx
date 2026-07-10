export default function TicketStub({ appointment, doctorName, hospitalName, hospitalAddress }) {
  return (
    <div className="ticket-stub mx-auto max-w-md overflow-hidden text-ink">
      <div className="bg-teal px-6 py-5 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70">MediConnect Appointment</p>
        <h3 className="font-display text-xl font-semibold">Dr. {doctorName}</h3>
        <p className="text-sm text-white/80">{hospitalName}</p>
        {hospitalAddress && <p className="text-xs text-white/60">{hospitalAddress}</p>}
      </div>

      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate">Date</p>
            <p className="font-medium">{appointment.appointment_date}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate">Token No.</p>
            <p className="token-number text-3xl font-bold text-marigold-dark">
              {String(appointment.token_number).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div className="ticket-divider my-4" />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate">Patient</p>
            <p className="font-medium">{appointment.patient_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Payment</p>
            <p className="font-medium capitalize">
              {appointment.payment_mode} · {appointment.payment_status}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate">
          Please arrive a little before your token is expected to be called. Bring this reference with you.
        </p>
      </div>
    </div>
  );
}