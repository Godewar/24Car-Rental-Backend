import mongoose from 'mongoose';

const investmentFDSchema = new mongoose.Schema({
  investorName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  investmentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'UPI']
  },
  investmentRate: {
    type: Number,
    required: true,
    min: 0
  },
  investmentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'withdrawn'],
    default: 'active'
  },
  maturityDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
investmentFDSchema.index({ investorName: 1 });
investmentFDSchema.index({ phone: 1 });
investmentFDSchema.index({ investmentDate: -1 });
investmentFDSchema.index({ status: 1 });

const InvestmentFD = mongoose.model('InvestmentFD', investmentFDSchema);

export default InvestmentFD;
