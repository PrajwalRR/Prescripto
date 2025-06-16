import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { Modal } from '@mui/material'

const MyAppointments = () => {
    const { backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [payment, setPayment] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    const getUserAppointments = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
                headers: { token }
            })
            setAppointments(data.appointments.reverse())
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/cancel-appointment`, { appointmentId }, {
                headers: { token }
            })
            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(`${backendUrl}/api/user/verifyRazorpay`, response, {
                        headers: { token }
                    })
                    if (data.success) {
                        navigate('/my-appointments')
                        getUserAppointments()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message)
                }
            }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/payment-razorpay`, { appointmentId }, {
                headers: { token }
            })
            if (data.success) {
                initPay(data.order)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/payment-stripe`, { appointmentId }, {
                headers: { token }
            })
            if (data.success) {
                window.location.replace(data.session_url)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const openOnlineConsultModal = (appointment) => {
        setSelectedAppointment(appointment)
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setSelectedAppointment(null)
    }

    const goToVideoConsult = () => {
        if (selectedAppointment) {
            navigate(`/video-consult/${selectedAppointment._id}`)
        }
    }

    useEffect(() => {
        if (token) {
            getUserAppointments()
        }
    }, [token])

    return (
        <div>
            <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
            <div className=''>
                {appointments.map((item, index) => (
                    <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
                        <div>
                            <img className='w-60 bg-[#EAEFFF]' src={item.docData.image} alt="" />
                        </div>

                        <div className='flex-1 text-[#5E5E5E] flex flex-col justify-center items-center text-center text-base gap-1'>
                            <p className='text-[#262626] text-lg font-semibold'>{item.docData.name}</p>
                            <p className='text-base'>{item.docData.speciality}</p>
                            <p className='text-[#464646] font-semibold mt-2'>Address:</p>
                            <p>{item.docData.address.line1}</p>
                            <p>{item.docData.address.line2}</p>
                            <p className='mt-2'>
                                <span className='text-[#3C3C3C] font-semibold'>Date & Time:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}
                            </p>
                        </div>

                        <div className='flex flex-col gap-2 justify-end text-sm text-center'>
                            {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id &&
                                <button onClick={() => setPayment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>
                                    Pay Online
                                </button>}
                            {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id &&
                                <>
                                    <button onClick={() => appointmentStripe(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 transition-all duration-300 flex items-center justify-center'>
                                        <img className='max-w-20 max-h-5' src={assets.stripe_logo} alt="" />
                                    </button>
                                    <button onClick={() => appointmentRazorpay(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 transition-all duration-300 flex items-center justify-center'>
                                        <img className='max-w-20 max-h-5' src={assets.razorpay_logo} alt="" />
                                    </button>
                                </>
                            }

                            {!item.cancelled && item.payment && !item.isCompleted &&
                                <button className='sm:min-w-48 py-2 border rounded text-[#696969] bg-[#EAEFFF]'>Paid</button>}

                            {item.isCompleted &&
                                <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}

                            {!item.cancelled && !item.isCompleted &&
                                <button onClick={() => cancelAppointment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}

                            {item.cancelled && !item.isCompleted &&
                                <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>}

                            {/* Online Consult Button */}
                            {!item.cancelled && item.payment &&
                                <button onClick={() => openOnlineConsultModal(item)} className='sm:min-w-48 py-2 border rounded text-blue-500 hover:bg-blue-100'>Online Consult</button>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Online Consult Modal */}
            <Modal open={modalOpen} onClose={closeModal}>
                <div className="absolute top-1/2 left-1/2 w-[90%] max-w-sm p-6 bg-white rounded shadow transform -translate-x-1/2 -translate-y-1/2">
                    {selectedAppointment && (
                        <>
                            <h2 className="text-xl font-semibold mb-2">Dr. {selectedAppointment.docData.name}</h2>
                            <p><strong>Speciality:</strong> {selectedAppointment.docData.speciality}</p>
                            <p><strong>Date:</strong> {slotDateFormat(selectedAppointment.slotDate)}</p>
                            <p><strong>Time:</strong> {selectedAppointment.slotTime}</p>
                            <div className="mt-4 flex justify-between">
                                <button
                                    onClick={goToVideoConsult}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Start Call
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 px-4 py-2 hover:underline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default MyAppointments
