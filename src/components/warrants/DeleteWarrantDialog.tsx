
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Warrant } from '@/types';

interface DeleteWarrantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
  isDeleting: boolean;
}

const DeleteWarrantDialog = ({ 
  isOpen, 
  onOpenChange,
  onConfirmDelete,
  isDeleting
}: DeleteWarrantDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من رغبتك في حذف أمر التوقيف؟ هذا الإجراء لا يمكن التراجع عنه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete} 
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'جاري الحذف...' : 'حذف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteWarrantDialog;
