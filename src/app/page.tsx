import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Your code deserves the best version control
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              A powerful, secure, and collaborative platform for your development workflow.
              Built with modern technologies for modern teams.
            </p>
            <div className="flex space-x-4">
              <a
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Sign up for free
              </a>
              <a
                href="/learn-more"
                className="border border-gray-400 hover:border-gray-300 px-6 py-3 rounded-md font-medium"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need for modern version control
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Powerful Collaboration</h3>
              <p className="text-gray-600">
                Work together seamlessly with your team using pull requests, code reviews,
                and detailed discussions.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Advanced Security</h3>
              <p className="text-gray-600">
                Keep your code safe with built-in security features, access controls,
                and automated vulnerability scanning.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Intuitive Interface</h3>
              <p className="text-gray-600">
                Navigate through your projects with ease using our clean,
                modern, and responsive design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to start your journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers who trust our platform for their version control needs.
          </p>
          <a
            href="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-md font-medium"
          >
            Get started for free
          </a>
        </div>
      </section>
    </main>
  );
}
