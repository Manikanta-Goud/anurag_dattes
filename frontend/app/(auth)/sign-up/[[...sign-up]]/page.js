'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="w-full max-w-md p-6">
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 
                'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white',
              card: 'shadow-2xl',
              headerTitle: 'text-2xl font-bold',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton: 
                'border-2 border-gray-200 hover:border-purple-300',
              formFieldInput: 
                'border-2 border-gray-200 focus:border-purple-500',
              footerActionLink: 
                'text-purple-600 hover:text-purple-700 font-semibold'
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
