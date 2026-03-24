import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';

interface DetailedPlanDeleteDialogProps {
    open: boolean;
    onClose: () => void;
    selectedObjectAlias: string;
    selectedObjectId: number | undefined;
    onConfirmDelete: (id: number) => void;
    isDeleting: boolean;
}

export const DetailedPlanDeleteDialog: React.FC<DetailedPlanDeleteDialogProps> = ({
    open,
    onClose,
    selectedObjectAlias,
    selectedObjectId,
    onConfirmDelete,
    isDeleting
}) => {
    if (!selectedObjectId) return null;

    return (
        <Dialog open={open} onClose={() => !isDeleting && onClose()} maxWidth="xs" fullWidth sx={{ zIndex: 1500 }}>
            <DialogTitle className="font-bold text-red-600">Delete Object?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to permanently delete <strong>{selectedObjectAlias}</strong>?
                    This will also remove all its status history and cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions className="px-4 pb-4 gap-2">
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={onClose}
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => onConfirmDelete(selectedObjectId)}
                    disabled={isDeleting}
                    startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
