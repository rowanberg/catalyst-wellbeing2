'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Construction } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FeesManagementPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#FAFAFA] p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 font-['Plus_Jakarta_Sans'] tracking-tight">
                        Fees Management
                    </h1>
                    <p className="text-gray-600 mt-2 font-['DM_Sans']">
                        Manage student fees, payments, and invoices.
                    </p>
                </div>

                <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                            <Construction className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Under Construction
                        </h2>
                        <p className="text-gray-500 max-w-md mb-8">
                            The Fees Management module is currently being built. Soon you'll be able to track payments, generate invoices, and manage fee structures here.
                        </p>
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                        >
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
