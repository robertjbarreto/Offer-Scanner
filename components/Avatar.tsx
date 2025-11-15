import React from 'react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';


interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';


export { Avatar, AvatarImage, AvatarFallback };
