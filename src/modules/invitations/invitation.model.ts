import { Schema, model, type HydratedDocument, type Model } from "mongoose";

export type ManagerInvitationProps = {
  tokenHash: string;    
  companyId: string; 
  used: boolean;      
};

export type ManagerInvitationDoc = HydratedDocument<ManagerInvitationProps>;
export interface ManagerInvitationModel extends Model<ManagerInvitationProps> {}

const schema = new Schema<ManagerInvitationProps>({
  tokenHash: { type: String, unique: true, index: true, required: true },
  companyId: { type: String, index: true, required: true },
  used: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export const ManagerInvitationModel = model<ManagerInvitationProps, ManagerInvitationModel>(
  "ManagerInvitation",
  schema
);
