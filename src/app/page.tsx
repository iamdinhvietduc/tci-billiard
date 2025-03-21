'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CalendarIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  TableCellsIcon,
  PencilSquareIcon,
  UserGroupIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Member {
  id: number;
  name: string;
  phone: string;
  avatar: string;
  payment_qr: string;
}

interface Bill {
  id: number;
  date: string;
  total_amount: number;
  table_number: string;
  status: 'active' | 'cancelled';
  start_time: string;
  end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ExtendedBill extends Omit<Bill, 'date'> {
  participants: number[];
  payments: Record<number, boolean>;
  organizer: Member;
  date: string;
  payer_id: number;
}

interface NewBill {
  date: string;
  totalAmount: number;
  participants: number[];
  tableNumber: string;
  payer: number;
  notes: string;
}

interface NewMember {
  name: string;
  phone: string;
  avatar: string;
  payment_qr: string;
}

interface DeleteConfirm {
  type: 'member' | 'trip';
  id: number;
  name: string;
}

interface PaymentQRModal {
  member: Member;
  amount: number;
  onClose: () => void;
  onConfirm: () => void;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [bills, setBills] = useState<ExtendedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [newMember, setNewMember] = useState<NewMember>({
    name: '',
    phone: '',
    avatar: '',
    payment_qr: ''
  });
  const [newBill, setNewBill] = useState<NewBill>({
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    participants: [],
    tableNumber: '1',
    payer: 0,
    notes: '',
  });
  const [showPaymentQR, setShowPaymentQR] = useState<{member: Member; amount: number; billId: number} | null>(null);
  const [qrZoom, setQrZoom] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersResponse, billsResponse] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/bills')
      ]);

      if (!membersResponse.ok || !billsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [membersData, billsData] = await Promise.all([
        membersResponse.json(),
        billsResponse.json()
      ]);

      console.log('Loaded members data:', membersData);
      setMembers(membersData);
      setBills(billsData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Tạm thời hiển thị preview
          const previewDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setNewMember(prev => ({ ...prev, payment_qr: previewDataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember),
      });

      if (!response.ok) {
        throw new Error('Failed to add member');
      }

      showToast('success', 'Thêm thành viên thành công');
      setShowAddMemberForm(false);
      setNewMember({
        name: '',
        phone: '',
        avatar: '',
        payment_qr: ''
      });
      await loadData();
    } catch (error) {
      console.error('Error adding member:', error);
      showToast('error', 'Lỗi khi thêm thành viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newBill.participants.length) {
      showToast('error', 'Vui lòng chọn ít nhất một người chơi');
      return;
    }

    if (!newBill.payer) {
      showToast('error', 'Vui lòng chọn người thanh toán');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBill),
      });

      if (!response.ok) {
        throw new Error('Failed to create bill');
      }

      showToast('success', 'Tạo hóa đơn thành công');
      setNewBill({
        date: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        participants: [],
        tableNumber: '1',
        payer: 0,
        notes: '',
      });
      await loadData();
    } catch (error) {
      console.error('Error creating bill:', error);
      showToast('error', 'Lỗi khi tạo hóa đơn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayerChange = (payerId: number) => {
    setNewBill(prev => ({
      ...prev,
      payer: payerId,
      participants: [] // Reset participants when payer changes
    }));
  };

  const toggleParticipant = (memberId: number) => {
    if (memberId === newBill.payer) return; // Cannot select payer as participant
    
    setNewBill(prev => {
      const isSelected = prev.participants.includes(memberId);
      return {
        ...prev,
        participants: isSelected
          ? prev.participants.filter(id => id !== memberId)
          : [...prev.participants, memberId]
      };
    });
  };

  const togglePaymentStatus = async (billId: number, participantId: number) => {
    try {
      const bill = bills.find(b => b.id === billId);
      if (!bill) {
        throw new Error('Không tìm thấy bill');
      }

      const currentPaymentStatus = bill.payments[participantId] || false;
      const newPaymentStatus = !currentPaymentStatus;

      const response = await fetch(`/api/bills/${billId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: billId,
          participantId: participantId,
          status: newPaymentStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Lỗi khi cập nhật trạng thái thanh toán');
      }

      const responseData = await response.json();
      if (responseData.success) {
        // Cập nhật state bills
        setBills(prevBills => prevBills.map(b => {
          if (b.id === billId) {
            return {
              ...b,
              payments: {
                ...b.payments,
                [participantId]: newPaymentStatus
              }
            };
          }
          return b;
        }));
      } else {
        throw new Error(responseData.message || 'Lỗi khi cập nhật trạng thái thanh toán');
      }

    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật trạng thái thanh toán');
    }
  };

  const calculateShare = (bill: ExtendedBill) => {
    if (bill.participants.length === 0) return 0;
    return Math.round(bill.total_amount / bill.participants.length);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      if (showDeleteConfirm.type === 'member') {
        // TODO: Implement member deletion API
        setMembers(prevMembers => prevMembers.filter(m => m.id !== showDeleteConfirm.id));
        setBills(prevBills => prevBills.filter(bill => 
          bill.payer_id !== showDeleteConfirm.id &&
          !bill.participants.includes(showDeleteConfirm.id)
        ));
      } else {
        // Gọi API hủy bill
        const response = await fetch(`/api/bills/${showDeleteConfirm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' })
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Lỗi khi hủy bill');
        }

        if (responseData.success) {
          // Cập nhật state bills
          setBills(prevBills => prevBills.map(bill => 
            bill.id === showDeleteConfirm.id 
              ? { ...bill, status: 'cancelled' }
              : bill
          ));
        } else {
          throw new Error(responseData.message || 'Lỗi khi hủy bill');
        }
      }

      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error handling delete:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý yêu cầu');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNewBill({ ...newBill, totalAmount: Number(value) * 1000 });
  };

  const displayAmount = (amount: number) => {
    return (amount / 1000).toString();
  };

  const downloadQR = async (qrUrl: string, name: string) => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">TCI Billiard</h1>
            <p className="text-gray-600 mt-1">Quản lý thanh toán tiền bida</p>
          </div>
          <button
            onClick={() => setShowAddMemberForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Thêm thành viên
          </button>
        </div>

        {/* Create Bill Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TableCellsIcon className="h-6 w-6 text-blue-600" />
            Tạo Bill Mới
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
              <input
                type="date"
                value={newBill.date}
                onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số bàn</label>
              <input
                type="number"
                value={newBill.tableNumber}
                onChange={(e) => setNewBill({ ...newBill, tableNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tổng tiền (nghìn VND)</label>
              <input
                type="text"
                value={displayAmount(newBill.totalAmount)}
                onChange={handleAmountChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập số tiền"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Người trả tiền</label>
              <select
                value={newBill.payer}
                onChange={(e) => handlePayerChange(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Chọn người trả tiền</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chọn người chơi */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
              Danh sách người chơi
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {members.map(member => {
                const isPayer = member.id === newBill.payer;
                const isSelected = newBill.participants.includes(member.id);

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-lg transition-all transform hover:scale-105 ${
                      isPayer 
                        ? 'bg-yellow-50 border-yellow-200 shadow-md cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50 border-blue-200 shadow-md cursor-pointer'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'
                    } border flex flex-col items-center`}
                    onClick={() => !isPayer && toggleParticipant(member.id)}
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className={`w-16 h-16 rounded-full mb-3 ${
                        isPayer
                          ? 'ring-4 ring-yellow-200'
                          : isSelected
                          ? 'ring-4 ring-blue-200'
                          : 'ring-2 ring-gray-200'
                      }`}
                    />
                    <span className="font-medium text-center line-clamp-2">{member.name}</span>
                    <span className="text-sm text-gray-500 mt-1">{member.phone}</span>
                    {isPayer && (
                      <span className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Người trả tiền
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleAddBill}
            disabled={!newBill.date || !newBill.totalAmount || !newBill.payer || newBill.participants.length === 0}
            className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm w-full md:w-auto"
          >
            Tạo Bill
          </button>
        </div>

        {/* Bills List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            Danh sách Bill
          </h2>
          {bills.map(bill => (
            <div
              key={bill.id}
              className={`bg-white rounded-lg shadow-sm p-6 ${
                bill.status === 'cancelled' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-600" />
                    Bill ngày {new Date(bill.date).toLocaleDateString()}
                    {bill.status === 'cancelled' && (
                      <span className="ml-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full">(Đã hủy)</span>
                    )}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600 flex items-center gap-2">
                      <TableCellsIcon className="h-4 w-4" />
                      Bàn số: {bill.table_number}
                    </p>
                    <p className="font-medium text-green-600 flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Tổng tiền: {formatCurrency(bill.total_amount)}
                    </p>
                    <p className="text-gray-600 flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4" />
                      Mỗi người: {formatCurrency(calculateShare(bill))}
                    </p>
                  </div>
                </div>
                {bill.status !== 'cancelled' && (
                  <button
                    onClick={() => setShowDeleteConfirm({
                      type: 'trip',
                      id: bill.id,
                      name: `Bill ngày ${new Date(bill.date).toLocaleDateString()}`
                    })}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Payer Section */}
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  Người thanh toán
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 bg-white p-3 rounded-lg flex-grow">
                    <img
                      src={bill.organizer.avatar}
                      alt={bill.organizer.name}
                      className="w-12 h-12 rounded-full ring-2 ring-blue-200"
                    />
                    <div>
                      <p className="font-medium text-lg">{bill.organizer.name}</p>
                      <p className="text-sm text-gray-600">Người trả tiền</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQRCode(bill.organizer.payment_qr)}
                    className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <QrCodeIcon className="h-5 w-5" />
                    Xem QR Code
                  </button>
                </div>
              </div>

              {/* Participants Section */}
              <div className="mt-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  Danh sách người chơi
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bill.participants.map(participantId => {
                    const member = members.find(m => m.id === participantId);
                    if (!member) return null;

                    const hasPaid = bill.payments[participantId];

                    return (
                      <div 
                        key={participantId} 
                        className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                          hasPaid ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          if (!bill.payments[participantId]) {
                            setShowPaymentQR({
                              member: bill.organizer,
                              amount: calculateShare(bill),
                              billId: bill.id
                            });
                          }
                        }}
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className={`w-12 h-12 rounded-full mb-3 ring-2 ${
                            hasPaid ? 'ring-green-200' : 'ring-gray-200'
                          }`}
                        />
                        <span className="font-medium text-center">{member.name}</span>
                        <span
                          className={`mt-2 px-4 py-1 rounded-full text-sm ${
                            hasPaid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {hasPaid ? 'Đã trả' : 'Chưa trả'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modals */}
        {showPaymentQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 ease-in-out">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Thanh toán cho {showPaymentQR.member.name}</h2>
                <button
                  onClick={() => setShowPaymentQR(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-50 w-full p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Số tiền cần thanh toán:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(showPaymentQR.amount)}</span>
                  </div>
                </div>
                <div className={`bg-white p-4 rounded-lg shadow-inner mb-6 relative ${qrZoom ? 'w-full' : ''}`}>
                  {qrLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {showPaymentQR.member.payment_qr ? (
                    <>
                      <img 
                        src={showPaymentQR.member.payment_qr} 
                        alt="QR Code" 
                        className={`${qrZoom ? 'w-full' : 'w-[250px] h-[250px]'} object-contain mx-auto transition-all duration-300`}
                        onLoad={() => setQrLoading(false)}
                        onError={(e) => {
                          console.error('Error loading QR image:', e);
                          e.currentTarget.src = '/placeholder-qr.png';
                          setQrLoading(false);
                        }}
                      />
                      <div className="flex justify-center gap-4 mt-4">
                        <button
                          onClick={() => setQrZoom(!qrZoom)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title={qrZoom ? "Thu nhỏ" : "Phóng to"}
                        >
                          {qrZoom ? (
                            <MagnifyingGlassMinusIcon className="h-6 w-6" />
                          ) : (
                            <MagnifyingGlassPlusIcon className="h-6 w-6" />
                          )}
                        </button>
                        <button
                          onClick={() => downloadQR(showPaymentQR.member.payment_qr, showPaymentQR.member.name)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Tải xuống"
                        >
                          <ArrowDownTrayIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-100 rounded-lg">
                      <span className="text-gray-500">QR không khả dụng</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 w-full">
                  <button
                    onClick={() => setShowPaymentQR(null)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      togglePaymentStatus(showPaymentQR.billId, showPaymentQR.member.id);
                      setShowPaymentQR(null);
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Xác nhận đã thanh toán
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-red-600">
                {showDeleteConfirm.type === 'trip' ? 'Hủy bill' : 'Xóa thành viên'}
              </h2>
              <p className="mb-6 text-gray-600">
                {showDeleteConfirm.type === 'trip'
                  ? `Bạn có chắc muốn hủy ${showDeleteConfirm.name}?`
                  : `Bạn có chắc muốn xóa thành viên ${showDeleteConfirm.name}?`}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Không
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  {showDeleteConfirm.type === 'trip' ? 'Hủy bill' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 ease-in-out">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Mã QR Thanh toán</h2>
                <button
                  onClick={() => setShowQRCode(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col items-center">
                <div className={`bg-white p-4 rounded-lg shadow-inner mb-6 relative ${qrZoom ? 'w-full' : ''}`}>
                  {qrLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {showQRCode ? (
                    <>
                      <img 
                        src={showQRCode} 
                        alt="QR Code" 
                        className={`${qrZoom ? 'w-full' : 'w-[250px] h-[250px]'} object-contain mx-auto transition-all duration-300`}
                        onLoad={() => setQrLoading(false)}
                        onError={(e) => {
                          console.error('Error loading QR image:', e);
                          e.currentTarget.src = '/placeholder-qr.png';
                          setQrLoading(false);
                        }}
                      />
                      <div className="flex justify-center gap-4 mt-4">
                        <button
                          onClick={() => setQrZoom(!qrZoom)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title={qrZoom ? "Thu nhỏ" : "Phóng to"}
                        >
                          {qrZoom ? (
                            <MagnifyingGlassMinusIcon className="h-6 w-6" />
                          ) : (
                            <MagnifyingGlassPlusIcon className="h-6 w-6" />
                          )}
                        </button>
                        <button
                          onClick={() => downloadQR(showQRCode, 'qr-code')}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Tải xuống"
                        >
                          <ArrowDownTrayIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-100 rounded-lg">
                      <span className="text-gray-500">QR không khả dụng</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowQRCode(null)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors w-full"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddMemberForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <UserIcon className="h-6 w-6 text-blue-600" />
                Thêm thành viên mới
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên thành viên</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập tên thành viên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã QR thanh toán</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQRUpload}
                      className="hidden"
                      id="qr-upload"
                    />
                    <label
                      htmlFor="qr-upload"
                      className="flex-1 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <QrCodeIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click để tải lên mã QR</span>
                      </div>
                    </label>
                    {newMember.payment_qr && (
                      <div className="w-24 h-24 relative">
                        <img
                          src={newMember.payment_qr}
                          alt="QR Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setNewMember({ ...newMember, payment_qr: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowAddMemberForm(false);
                    setNewMember({ name: '', phone: '', avatar: '', payment_qr: '' });
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!newMember.name || !newMember.payment_qr || isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    'Thêm thành viên'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

