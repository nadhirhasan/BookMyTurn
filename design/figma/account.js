if (page.children.some(n => n.name === '04 / Account is optional')) throw new Error('Account board already exists.');
const group = board('04 / Account is optional', 3220, 3);
const signin = phone(group, 'signin', '11 Sign In', 0, 0, true);
txt(signin.content, 'Good to see you.', 'Title');
txt(signin.content, 'Sign in to keep your visits together. Just browsing? You can continue as a guest.', 'Body', 353, 'muted');
field(signin.content, 'Email address', 'you@example.com'); field(signin.content, 'Password', 'Enter your password');
txt(signin.content, 'Forgot password?', 'Caption', 353, 'text', 'RIGHT');
const message = auto(signin.content, 'Validation example', 'HORIZONTAL', 353, null, 8, 12, 'surface'); radius(message); icon(message, 'circle-help', 16); txt(message, 'Enter your email address and password to sign in.', 'Caption', 305, 'muted');
tap(button(signin.content, 'Sign In'), 'home');
const create = txt(signin.content, 'New here? Create an account', 'Label', 353, 'text', 'CENTER'); tap(create, 'signup');
tap(button(signin.footer, 'Continue as Guest', true), 'home');

const signup = phone(group, 'signup', '12 Create Account', 1, 0, true);
txt(signup.content, 'Make time\nfor your next visit.', 'Title');
txt(signup.content, 'Create an optional customer account. Browsing and joining through a salon QR code stay open to guests.', 'Body', 353, 'muted');
field(signup.content, 'Name', 'Your name'); field(signup.content, 'Email address', 'you@example.com'); field(signup.content, 'Password', 'Create a password'); field(signup.content, 'Confirm password', 'Re-enter your password');
tap(button(signup.content, 'Create Account'), 'verify');
const login = txt(signup.content, 'Already have an account? Sign in', 'Label', 353, 'text', 'CENTER'); tap(login, 'signin');
tap(button(signup.footer, 'Continue as Guest', true), 'home');

const verify = phone(group, 'verify', '13 Check Your Email', 2, 0, true);
const mail = auto(verify.content, 'Email verification icon', 'HORIZONTAL', 72, 72, 0, 0, 'surface'); radius(mail, 24); mail.counterAxisAlignItems = 'CENTER'; mail.primaryAxisAlignItems = 'CENTER'; icon(mail, 'mail', 28);
txt(verify.content, 'Check your inbox.', 'Title');
txt(verify.content, 'We’ve sent an email confirmation link. Verify your address before signing in.', 'Body', 353, 'muted');
note(verify.content, 'This prototype shows the account flow only. It does not create an account or send an email.');
tap(button(verify.content, 'Back to Sign In'), 'signin');
tap(button(verify.footer, 'Continue as Guest', true), 'home');
return result({ boardId: group.id });
