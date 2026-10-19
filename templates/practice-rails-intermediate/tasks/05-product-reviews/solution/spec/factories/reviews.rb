FactoryBot.define do
  factory :review do
    product
    member
    rating { 5 }
  end
end
