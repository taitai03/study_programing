class Admin::LoansController < Admin::BaseController
  # POST /admin/office_items/:office_item_id/loans
  def create
    office_item = OfficeItem.find(params[:office_item_id])
    loan = office_item.loans.new(params.expect(loan: %i[user_id due_on]))
    if loan.save
      redirect_to admin_office_items_path, notice: "「#{office_item.name}」を#{loan.user.name}さんに貸し出しました"
    else
      redirect_to admin_office_items_path, alert: "「#{office_item.name}」を貸し出せません: #{loan.errors.full_messages.join('、')}"
    end
  end

  # PATCH /admin/loans/:id/return
  def return
    loan = Loan.find(params[:id])
    loan.return!
    redirect_to admin_office_items_path, notice: "「#{loan.office_item.name}」の返却を記録しました"
  rescue Loan::AlreadyReturned => e
    redirect_to admin_office_items_path, alert: e.message
  end
end
