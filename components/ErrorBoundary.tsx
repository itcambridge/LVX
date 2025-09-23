"use client";
import React from "react";

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: any}> {
  constructor(props:any) { 
    super(props); 
    this.state = { error: null }; 
  }
  
  static getDerivedStateFromError(error:any){ 
    return { error }; 
  }
  
  render(){
    if (this.state.error) {
      return (
        <div className="max-w-xl mx-auto p-4">
          <h2 className="font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-600">Try reloading or going back.</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}
